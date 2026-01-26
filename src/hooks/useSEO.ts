import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogType?: string;
  structuredData?: object;
}

const routeSEOConfig: Record<string, SEOConfig> = {
  '/': {
    title: 'Malware Analyst | MIA & MRE Dashboards',
    description: 'Centralized dashboards for malware incident analysis and reverse engineering with MITRE ATT&CK mapping, IOC tracking, and timeline analysis.',
    keywords: 'malware analysis, DFIR, incident response, reverse engineering, MITRE ATT&CK, IOC, threat intelligence',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Malware Analyst Dashboard',
      description: 'Centralized dashboards for malware incident analysis and reverse engineering',
      applicationCategory: 'Security Software',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Malware Incident Analysis (MIA)',
        'Malware Reverse Engineering (MRE)',
        'MITRE ATT&CK Mapping',
        'IOC Tracking',
        'Timeline Analysis',
        'Export to PDF/Word/JSON',
      ],
    },
  },
  '/mia': {
    title: 'MIA Dashboard | Malware Incident Analysis',
    description: 'Malware Incident Analysis dashboard for DFIR investigations. Track IOCs, map to MITRE ATT&CK, analyze behavior, and create comprehensive incident reports.',
    keywords: 'DFIR, incident analysis, malware investigation, IOC tracking, MITRE ATT&CK, threat hunting, forensics',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MIA - Malware Incident Analysis Dashboard',
      description: 'DFIR dashboard for malware incident analysis and investigation',
      applicationCategory: 'Security Software',
      applicationSubCategory: 'Digital Forensics',
      featureList: [
        'Background & Case Information',
        'Static Analysis Documentation',
        'Behavioral Analysis',
        'MITRE ATT&CK Mapping',
        'IOC Collection & Tracking',
        'Timeline Creation',
        'Evidence Artifacts Management',
        'Export to PDF/Word/JSON',
      ],
    },
  },
  '/mre': {
    title: 'MRE Dashboard | Malware Reverse Engineering',
    description: 'Malware Reverse Engineering dashboard for deep analysis. Document PE sections, code analysis, runtime behavior, MBC mapping, and detection signatures.',
    keywords: 'reverse engineering, malware analysis, PE analysis, code analysis, MBC, YARA, packer detection',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MRE - Malware Reverse Engineering Dashboard',
      description: 'Dashboard for malware reverse engineering and deep analysis',
      applicationCategory: 'Security Software',
      applicationSubCategory: 'Reverse Engineering',
      featureList: [
        'PE Section Analysis',
        'Static Code Analysis',
        'Dynamic Code Analysis',
        'Runtime Behavior Documentation',
        'Unpacking Layer Tracking',
        'MBC Behavior Mapping',
        'IOC Extraction',
        'YARA Signature Development',
        'Export to PDF/Word/JSON',
      ],
    },
  },
  '/tools': {
    title: 'Tools | FLARE-VM Analysis Tools',
    description: 'Comprehensive list of malware analysis tools from Mandiant FLARE-VM. Browse tools by category for reverse engineering and incident response.',
    keywords: 'FLARE-VM, malware tools, reverse engineering tools, forensics tools, analysis software',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'FLARE-VM Analysis Tools',
      description: 'Curated list of malware analysis and reverse engineering tools',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Disassemblers' },
        { '@type': 'ListItem', position: 2, name: 'Debuggers' },
        { '@type': 'ListItem', position: 3, name: 'Decompilers' },
        { '@type': 'ListItem', position: 4, name: 'PE Analysis Tools' },
        { '@type': 'ListItem', position: 5, name: 'Network Analysis Tools' },
      ],
    },
  },
  '/settings': {
    title: 'Settings | Malware Analyst Dashboard',
    description: 'Configure your Malware Analyst Dashboard settings including user profile, language preferences, and data management.',
    keywords: 'settings, configuration, preferences',
    ogType: 'website',
  },
};

const defaultConfig: SEOConfig = {
  title: 'Malware Analyst Dashboard',
  description: 'Professional dashboards for malware incident analysis and reverse engineering.',
  ogType: 'website',
};

/**
 * Updates document meta tags for SEO
 */
function updateMetaTags(config: SEOConfig) {
  // Update title
  document.title = config.title;

  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', config.description);

  // Update or create meta keywords
  if (config.keywords) {
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', config.keywords);
  }

  // Update Open Graph tags
  updateOGMeta('og:title', config.title);
  updateOGMeta('og:description', config.description);
  updateOGMeta('og:type', config.ogType || 'website');

  // Update Twitter tags
  updateOGMeta('twitter:title', config.title);
  updateOGMeta('twitter:description', config.description);
}

function updateOGMeta(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) || 
             document.querySelector(`meta[name="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    if (property.startsWith('twitter:')) {
      meta.setAttribute('name', property);
    } else {
      meta.setAttribute('property', property);
    }
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Updates or creates JSON-LD structured data
 */
function updateStructuredData(data?: object) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[data-seo="structured-data"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data if provided
  if (data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'structured-data');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}

/**
 * Hook to manage SEO meta tags and structured data per route
 */
export function useSEO() {
  const location = useLocation();

  useEffect(() => {
    const config = routeSEOConfig[location.pathname] || defaultConfig;
    
    // Update meta tags
    updateMetaTags(config);
    
    // Update structured data
    updateStructuredData(config.structuredData);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}${location.pathname}`);
  }, [location.pathname]);
}
