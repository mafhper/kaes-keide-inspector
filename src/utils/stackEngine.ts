import stackDBFull from './stack-db.json';
export const stackDB = stackDBFull as any;

interface TechMatch {
  name: string;
  version?: string;
  confidence: number;
  categories: { id: number; name: string }[];
  icon?: string;
  evidence: { type: EvidenceType; detail: string; confidence: number }[];
  evidenceTypes: EvidenceType[];
}

type EvidenceType = 'url' | 'headers' | 'meta' | 'html' | 'scriptSrc' | 'cookies' | 'js' | 'dom';

interface DetectionSignal {
  name: string;
  version?: string;
  categories: { id: number; name: string }[];
  icon?: string;
  perEvidence: Partial<Record<EvidenceType, number>>;
  evidence: { type: EvidenceType; detail: string; confidence: number }[];
}

interface Pattern {
  regex: RegExp;
  version: string;
  confidence: number;
}

// Parses syntax: "^WordPress(;version:\\1)(;confidence:50)"
function parsePattern(str: string): Pattern {
  const parts = str.split('\\;');
  const regexStr = parts[0];
  let version = '';
  let confidence = 100;

  for (let i = 1; i < parts.length; i++) {
    const attr = parts[i];
    if (attr.startsWith('version:')) version = attr.substring(8);
    else if (attr.startsWith('confidence:')) confidence = parseInt(attr.substring(11), 10);
  }

  try {
    return {
      regex: new RegExp(regexStr.replace(/\\/g, '\\').replace(/\//g, '\\/'), 'i'),
      version,
      confidence
    };
  } catch {
    // Fallback for invalid regexes
    return { regex: /$.^/, version: '', confidence: 0 };
  }
}

function resolveVersion(versionDef: string, match: RegExpExecArray): string {
  if (!versionDef || !match) return '';
  let resolved = versionDef;
  for (let i = 0; i < match.length; i++) {
    const val = match[i] || '';
    resolved = resolved.replace(new RegExp(`\\\\\\\\${i}`, 'g'), val);
    resolved = resolved.replace(new RegExp(`\\\\${i}`, 'g'), val); // try both
  }
  return resolved; // Base syntax processing with backreferences
}

function checkPatterns(patterns: string | string[], value: string): { matches: boolean; version: string; confidence: number } {
  const arr = Array.isArray(patterns) ? patterns : [patterns];
  for (const p of arr) {
    const parsed = parsePattern(p);
    const match = parsed.regex.exec(value);
    if (match) {
      return { matches: true, version: resolveVersion(parsed.version, match), confidence: parsed.confidence };
    }
  }
  return { matches: false, version: '', confidence: 0 };
}

export function detectTechnologies(pageData: {
  url: string;
  html: string;
  headers: Record<string, string[]>;
  scripts: string[];
  meta: Record<string, string[]>;
  cookies: Record<string, string>;
  js: Record<string, any>;
  dom: Record<string, Element[]>;
}, options?: { mode?: 'strict' | 'compat' }): TechMatch[] {
  const mode = options?.mode === 'compat' ? 'compat' : 'strict';
  const detected = new Map<string, DetectionSignal>();

  function addDetection(
    techName: string,
    techDef: any,
    version: string,
    confidence: number,
    evidenceType: EvidenceType,
    evidenceDetail: string,
  ) {
    if (confidence <= 0) return;
    const weighted = Math.max(1, Math.round(confidence * EVIDENCE_WEIGHTS[evidenceType]));
    const existing = detected.get(techName);
    if (existing) {
      const prev = existing.perEvidence[evidenceType] || 0;
      existing.perEvidence[evidenceType] = Math.max(prev, weighted);
      appendEvidence(existing.evidence, { type: evidenceType, detail: evidenceDetail, confidence: weighted });
      if (version && version.length > (existing.version?.length || 0)) {
        existing.version = version;
      }
    } else {
      const cats = (techDef.cats || []).map((c: number) => ({
        id: c,
        name: (stackDB.categories as any)[c]?.name || 'Unknown'
      }));
      detected.set(techName, {
        name: techName,
        version: version || undefined,
        categories: cats,
        icon: techDef.icon,
        perEvidence: {
          [evidenceType]: weighted,
        },
        evidence: [{ type: evidenceType, detail: evidenceDetail, confidence: weighted }],
      });
    }
  }

  for (const [techName, techDef] of Object.entries(stackDB.technologies)) {
    const tech = techDef as any;

    // 1. URL
    if (tech.url) {
      const res = checkPatterns(tech.url, pageData.url);
      if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'url', `URL matched: ${pageData.url}`);
    }

    // 2. Headers
    if (tech.headers) {
      for (const [headerName, headerPattern] of Object.entries(tech.headers)) {
        const headerNameLower = headerName.toLowerCase();
        const headerValues = pageData.headers[headerNameLower];
        if (headerValues) {
          for (const val of headerValues) {
            const res = checkPatterns(headerPattern as string, val);
            if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'headers', `Header ${headerName}: ${truncateEvidence(val)}`);
          }
        }
      }
    }

    // 3. Meta
    if (tech.meta) {
      for (const [metaName, metaPattern] of Object.entries(tech.meta)) {
        const metaValues = pageData.meta[metaName.toLowerCase()];
        if (metaValues) {
          for (const val of metaValues) {
            const res = checkPatterns(metaPattern as string, val);
            if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'meta', `Meta ${metaName}: ${truncateEvidence(val)}`);
          }
        }
      }
    }

    // 4. HTML
    if (tech.html) {
      const res = checkPatterns(tech.html, pageData.html);
      if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'html', 'HTML pattern match');
    }

    // 5. Scripts (src attributes)
    if (tech.scriptSrc) {
      for (const src of pageData.scripts) {
        const res = checkPatterns(tech.scriptSrc, src);
        if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'scriptSrc', `Script: ${truncateEvidence(src)}`);
      }
    }

    // 6. Cookies
    if (tech.cookies) {
      for (const [cookieName, cookiePattern] of Object.entries(tech.cookies)) {
        const val = pageData.cookies[cookieName];
        if (val !== undefined) {
          const res = checkPatterns(cookiePattern as string, val);
          if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'cookies', `Cookie: ${cookieName}`);
        }
      }
    }

    // 7. JS (Globals)
    if (tech.js && pageData.js) {
      for (const [jsProp, jsPattern] of Object.entries(tech.js)) {
        const val = pageData.js[jsProp];
        if (val !== undefined) {
          // If pattern is empty string, presence is enough
          if (jsPattern === '') {
            addDetection(techName, tech, '', 100, 'js', `JS global: ${jsProp}`);
          } else {
            const res = checkPatterns(jsPattern as string, String(val));
            if (res.matches) addDetection(techName, tech, res.version, res.confidence, 'js', `JS global: ${jsProp}`);
          }
        }
      }
    }

    // 8. DOM (Selectors with optional constraints)
    if (tech.dom && pageData.dom) {
      const domRules = Array.isArray(tech.dom) ? tech.dom : [tech.dom];
      for (const rule of domRules) {
        if (typeof rule === 'string') {
          if ((pageData.dom[rule]?.length || 0) > 0) {
            addDetection(techName, tech, '', 100, 'dom', `DOM selector: ${rule}`);
          }
        } else if (typeof rule === 'object') {
          for (const [selector, condition] of Object.entries(rule)) {
            const elements = pageData.dom[selector] || [];
            if (elements.length === 0) continue;

            const evalRes = evaluateDomCondition(elements, condition);
            if (evalRes.matches) {
              addDetection(
                techName,
                tech,
                evalRes.version,
                evalRes.confidence,
                'dom',
                `DOM ${selector}${describeDomCondition(condition)}`,
              );
            }
          }
        }
      }
    }
  }

  const scored = scoreAndFilterDetections(detected, mode);
  enforceRequirements(scored);
  return Array.from(scored.values());
}

function evaluateDomCondition(elements: Element[], condition: unknown): { matches: boolean; version: string; confidence: number } {
  if (!condition || typeof condition !== 'object') {
    return { matches: elements.length > 0, version: '', confidence: 100 };
  }

  const rule = condition as {
    exists?: string;
    text?: string | string[];
    class?: string | string[];
    attributes?: Record<string, string | string[]>;
    properties?: Record<string, string | string[]>;
  };

  let totalConfidence = 0;
  let bestVersion = '';
  let matchedAny = false;

  const adopt = (res: { matches: boolean; version: string; confidence: number }) => {
    if (!res.matches) return false;
    matchedAny = true;
    totalConfidence += res.confidence || 0;
    if (res.version && res.version.length > bestVersion.length) bestVersion = res.version;
    return true;
  };

  if (rule.exists !== undefined) {
    const res = rule.exists === '' ? { matches: true, version: '', confidence: 100 } : checkPatterns(rule.exists, 'true');
    if (!adopt(res)) return { matches: false, version: '', confidence: 0 };
  }

  if (rule.text !== undefined) {
    const res = matchAny(elements, (el) => (el.textContent || '').trim(), rule.text);
    if (!adopt(res)) return { matches: false, version: '', confidence: 0 };
  }

  if (rule.class !== undefined) {
    const res = matchAny(elements, (el) => (el.getAttribute('class') || '').trim(), rule.class);
    if (!adopt(res)) return { matches: false, version: '', confidence: 0 };
  }

  if (rule.attributes) {
    for (const [attrName, attrPattern] of Object.entries(rule.attributes)) {
      const res = attrName.toLowerCase() === 'text'
        ? matchAny(elements, (el) => (el.textContent || '').trim(), attrPattern)
        : matchAny(elements, (el) => (el.getAttribute(attrName) || '').trim(), attrPattern);
      if (!adopt(res)) return { matches: false, version: '', confidence: 0 };
    }
  }

  if (rule.properties) {
    for (const [propName, propPattern] of Object.entries(rule.properties)) {
      const res = matchAny(elements, (el) => {
        const value = (el as unknown as Record<string, unknown>)[propName];
        if (value === undefined || value === null) return '';
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : '';
      }, propPattern);
      if (!adopt(res)) return { matches: false, version: '', confidence: 0 };
    }
  }

  if (!matchedAny) {
    return { matches: elements.length > 0, version: '', confidence: 100 };
  }

  return {
    matches: true,
    version: bestVersion,
    confidence: Math.max(1, Math.min(100, totalConfidence || 100)),
  };
}

function matchAny(
  elements: Element[],
  pick: (el: Element) => string,
  pattern: string | string[],
): { matches: boolean; version: string; confidence: number } {
  const best: { matches: boolean; version: string; confidence: number } = { matches: false, version: '', confidence: 0 };

  for (const el of elements) {
    const value = pick(el);
    if (!value) continue;
    const res = checkPatterns(pattern, value);
    if (res.matches) {
      if (res.version.length > best.version.length) best.version = res.version;
      best.matches = true;
      best.confidence = Math.max(best.confidence, res.confidence);
    }
  }

  return best;
}

const EVIDENCE_WEIGHTS: Record<EvidenceType, number> = {
  url: 1,
  headers: 1,
  meta: 0.95,
  html: 0.85,
  scriptSrc: 0.8,
  cookies: 0.9,
  js: 0.85,
  dom: 0.9,
};

const STRONG_EVIDENCE: EvidenceType[] = ['url', 'headers', 'meta', 'cookies'];

function computeConfidence(signal: DetectionSignal): number {
  const evidenceScores = Object.values(signal.perEvidence) as number[];
  const base = evidenceScores.reduce((sum, value) => sum + value, 0);
  const evidenceCount = evidenceScores.length;
  const diversityBonus = evidenceCount > 1 ? Math.min(15, (evidenceCount - 1) * 5) : 0;
  return Math.max(1, Math.min(100, Math.round(base + diversityBonus)));
}

function scoreAndFilterDetections(signals: Map<string, DetectionSignal>, mode: 'strict' | 'compat'): Map<string, TechMatch> {
  const out = new Map<string, TechMatch>();

  for (const [techName, signal] of signals.entries()) {
    const evidenceTypes = Object.keys(signal.perEvidence) as EvidenceType[];
    const confidence = computeConfidence(signal);
    const hasStrongEvidence = evidenceTypes.some((type) => STRONG_EVIDENCE.includes(type));

    if (mode === 'strict') {
      if (evidenceTypes.length === 1) {
        const type = evidenceTypes[0];
        const score = signal.perEvidence[type] || 0;
        if (type === 'dom' && score < 85) continue;
        if (type === 'js' && score < 80) continue;
        if (type === 'scriptSrc' && score < 75) continue;
        if (type === 'html' && score < 85) continue;
      }

      if (!hasStrongEvidence && confidence < 80) continue;
    } else {
      if (!hasStrongEvidence && confidence < 55) continue;
    }

    out.set(techName, {
      name: signal.name,
      version: signal.version,
      confidence,
      categories: signal.categories,
      icon: signal.icon,
      evidence: signal.evidence
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8),
      evidenceTypes: Array.from(new Set(signal.evidence.map((item) => item.type))),
    });
  }

  return out;
}

function appendEvidence(
  evidence: Array<{ type: EvidenceType; detail: string; confidence: number }>,
  item: { type: EvidenceType; detail: string; confidence: number },
) {
  const existing = evidence.find((entry) => entry.type === item.type && entry.detail === item.detail);
  if (existing) {
    existing.confidence = Math.max(existing.confidence, item.confidence);
    return;
  }
  evidence.push(item);
}

function truncateEvidence(input: string): string {
  const compact = input.replace(/\s+/g, ' ').trim();
  if (compact.length <= 80) return compact;
  return `${compact.slice(0, 77)}...`;
}

function describeDomCondition(condition: unknown): string {
  if (!condition || typeof condition !== 'object') return '';
  const keys = Object.keys(condition as Record<string, unknown>);
  if (keys.length === 0) return '';
  return ` (${keys.join(', ')})`;
}

function enforceRequirements(detected: Map<string, TechMatch>) {
  let changed = true;

  const hasCategory = (ids: number[]): boolean => {
    for (const tech of detected.values()) {
      if (tech.categories.some((category) => ids.includes(category.id))) return true;
    }
    return false;
  };

  while (changed) {
    changed = false;

    for (const techName of Array.from(detected.keys())) {
      const def = (stackDB.technologies as Record<string, any>)[techName];
      if (!def) continue;

      if (def.requires) {
        const required = Array.isArray(def.requires) ? def.requires : [def.requires];
        const allPresent = required.every((name: string) => detected.has(name));
        if (!allPresent) {
          detected.delete(techName);
          changed = true;
          continue;
        }
      }

      if (def.requiresCategory) {
        const requiredCategories = Array.isArray(def.requiresCategory) ? def.requiresCategory : [def.requiresCategory];
        const normalized = requiredCategories
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isFinite(id));
        if (normalized.length > 0 && !hasCategory(normalized)) {
          detected.delete(techName);
          changed = true;
        }
      }
    }
  }
}
