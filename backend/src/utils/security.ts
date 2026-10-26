import dns from 'dns';

// Vérifie si une chaîne IPv4 correspond à une plage privée / réservée
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [b0, b1] = parts;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (Private RFC 1918)
  if (b0 === 10) return true;
  // 172.16.0.0/12 (Private RFC 1918)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.168.0.0/16 (Private RFC 1918)
  if (b0 === 192 && b1 === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata ex: AWS, GCP)
  if (b0 === 169 && b1 === 254) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  return false;
}

// Vérifie si une chaîne IPv6 correspond à une plage privée ou de bouclage
export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Loopback ::1
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // Unique Local Address fc00::/7 (fc.. ou fd..)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // Link-Local fe80::/10
  if (lower.startsWith('fe80:')) return true;
  // IPv4-mapped IPv6 ::ffff:127.0.0.1
  if (lower.startsWith('::ffff:')) {
    const ipv4Part = lower.replace('::ffff:', '');
    return isPrivateIPv4(ipv4Part);
  }
  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  domain?: string;
  errorMessage?: string;
}

/**
 * Validation stricte d'URL avec protection Anti-SSRF complète
 */
export async function validateAndSanitizeUrl(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, errorMessage: "L'URL est requise et doit être une chaîne valide." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, errorMessage: "Format d'URL syntaxiquement invalide." };
  }

  // 1. Contrôle strict du protocole
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      errorMessage: `Protocole '${parsed.protocol}' interdit. Seuls http: et https: sont autorisés.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Contrôle des hostnames littéraux réservés
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    return {
      isValid: false,
      errorMessage: "Sécurité : L'accès aux hôtes locaux et métadonnées internes est formellement bloqué.",
    };
  }

  // 3. Vérification si le hostname est une IP littérale
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return {
        isValid: false,
        errorMessage: `Sécurité : L'adresse IP '${hostname}' appartient à une plage privée ou réservée interdite.`,
      };
    }
  }

  // 4. Résolution DNS proactive pour contrer le DNS rebinding vers des IP privées
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    for (const record of lookupResult) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return {
          isValid: false,
          errorMessage: `Sécurité (Anti-SSRF) : Le domaine '${hostname}' résout vers l'IP privée ${record.address}, accès refusé.`,
        };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return {
          isValid: false,
          errorMessage: `Sécurité (Anti-SSRF) : Le domaine '${hostname}' résout vers l'IP IPv6 privée ${record.address}, accès refusé.`,
        };
      }
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    return {
      isValid: false,
      errorMessage: `Échec de résolution DNS pour l'hôte '${hostname}' : ${error.code || 'DOMAINE_INTROUVABLE'}`,
    };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.origin + parsed.pathname + parsed.search,
    domain: hostname,
  };
}
