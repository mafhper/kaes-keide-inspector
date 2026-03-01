import stackDBFull from './stack-db.json';
export const stackDB = stackDBFull as any;

interface TechMatch {
  name: string;
  version?: string;
  confidence: number;
  categories: { id: number; name: string }[];
  icon?: string;
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
  dom: Record<string, boolean>;
}): TechMatch[] {
  const detected = new Map<string, TechMatch>();

  function addDetection(techName: string, techDef: any, version: string, confidence: number) {
    if (confidence <= 0) return;
    const existing = detected.get(techName);
    if (existing) {
      existing.confidence = Math.min(100, existing.confidence + confidence);
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
        confidence,
        categories: cats,
        icon: techDef.icon
      });
    }
  }

  for (const [techName, techDef] of Object.entries(stackDB.technologies)) {
    const tech = techDef as any;

    // 1. URL
    if (tech.url) {
      const res = checkPatterns(tech.url, pageData.url);
      if (res.matches) addDetection(techName, tech, res.version, res.confidence);
    }

    // 2. Headers
    if (tech.headers) {
      for (const [headerName, headerPattern] of Object.entries(tech.headers)) {
        const headerNameLower = headerName.toLowerCase();
        const headerValues = pageData.headers[headerNameLower];
        if (headerValues) {
          for (const val of headerValues) {
            const res = checkPatterns(headerPattern as string, val);
            if (res.matches) addDetection(techName, tech, res.version, res.confidence);
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
            if (res.matches) addDetection(techName, tech, res.version, res.confidence);
          }
        }
      }
    }

    // 4. HTML
    if (tech.html) {
      const res = checkPatterns(tech.html, pageData.html);
      if (res.matches) addDetection(techName, tech, res.version, res.confidence);
    }

    // 5. Scripts (src attributes)
    if (tech.scriptSrc) {
      for (const src of pageData.scripts) {
        const res = checkPatterns(tech.scriptSrc, src);
        if (res.matches) addDetection(techName, tech, res.version, res.confidence);
      }
    }

    // 6. Cookies
    if (tech.cookies) {
      for (const [cookieName, cookiePattern] of Object.entries(tech.cookies)) {
        const val = pageData.cookies[cookieName];
        if (val !== undefined) {
          const res = checkPatterns(cookiePattern as string, val);
          if (res.matches) addDetection(techName, tech, res.version, res.confidence);
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
            addDetection(techName, tech, '', 100);
          } else {
            const res = checkPatterns(jsPattern as string, String(val));
            if (res.matches) addDetection(techName, tech, res.version, res.confidence);
          }
        }
      }
    }

    // 8. DOM (Selectors)
    if (tech.dom && pageData.dom) {
      const domRules = Array.isArray(tech.dom) ? tech.dom : [tech.dom];
      for (const rule of domRules) {
        if (typeof rule === 'string') {
          if (pageData.dom[rule]) {
            addDetection(techName, tech, '', 100);
          }
        } else if (typeof rule === 'object') {
          for (const [selector] of Object.entries(rule)) {
            if (pageData.dom[selector]) {
              // Basic existence match for now
              addDetection(techName, tech, '', 100);
            }
          }
        }
      }
    }
  }

  return Array.from(detected.values());
}
