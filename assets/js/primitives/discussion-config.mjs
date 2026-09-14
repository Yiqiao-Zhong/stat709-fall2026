// One validator shared by the build and browser. Public configuration only.
export function validateDiscussionSite(config) {
  const allowed=['provider','enabled','shortname','siteUrl','identifierPrefix'];
  if (!config || typeof config!=='object' || Array.isArray(config) || Object.keys(config).some(k=>!allowed.includes(k)) || allowed.some(k=>!(k in config))) throw new Error('Invalid site discussion configuration fields');
  if (typeof config.identifierPrefix!=='string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.identifierPrefix)) throw new Error('A stable discussion identifierPrefix is required');
  validateDiscussion({provider:config.provider,enabled:config.enabled,shortname:config.shortname,pageUrl:config.siteUrl,identifier:config.identifierPrefix,title:'Site configuration'});
  if (config.siteUrl!==null && !new URL(config.siteUrl).pathname.endsWith('/')) throw new Error('Discussion siteUrl must end in /');
  return config;
}

export function discussionForPage(site, stem, title) {
  validateDiscussionSite(site);
  const lecture=stem.match(/^lect-([1-9]\d*)$/);
  if (stem!=='preface' && !lecture) throw new Error('Discussion requires a preface or lecture page');
  const suffix=lecture ? `lec${lecture[1].padStart(2,'0')}` : 'preface';
  return validateDiscussion({
    provider:site.provider, enabled:site.enabled, shortname:site.shortname,
    pageUrl:site.siteUrl===null ? null : new URL(`${stem}.html`,site.siteUrl).href,
    identifier:`${site.identifierPrefix}-${suffix}`, title,
  });
}

export function validateDiscussion(config) {
  const allowed=['provider','enabled','shortname','pageUrl','identifier','title'];
  if(!config || typeof config!=='object' || Array.isArray(config) || Object.keys(config).some(k=>!allowed.includes(k)) || allowed.some(k=>!(k in config)))throw new Error('Invalid discussion configuration fields');
  if(config.provider!=='disqus'||typeof config.enabled!=='boolean')throw new Error('Discussion requires provider disqus and a boolean enabled flag');
  for(const key of ['identifier','title'])if(typeof config[key]!=='string'||!config[key].trim())throw new Error(`Discussion ${key} is required`);
  if(config.shortname!==null&&(typeof config.shortname!=='string'||! /^[a-z0-9][a-z0-9-]*$/.test(config.shortname)))throw new Error('Invalid Disqus site shortname');
  if(config.pageUrl!==null){
    let url;try{url=new URL(config.pageUrl);}catch{throw new Error('Invalid discussion pageUrl');}
    if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||!isPublicHostname(url.hostname))throw new Error('Discussion pageUrl must be a public canonical HTTPS URL without credentials, query or fragment');
  }
  if(config.enabled&&(!config.shortname||!config.pageUrl))throw new Error('Enabled discussion requires the registered shortname and public pageUrl');
  return config;
}
function isPublicHostname(host){
  return host.includes('.') && !host.endsWith('.localhost') && !host.endsWith('.local') && !host.endsWith('.test') && !host.endsWith('.invalid') && host!=='localhost' && !host.includes(':') && !/^\d+(\.\d+){3}$/.test(host);
}
export function discussionMode(config,currentUrl) {
  validateDiscussion(config);
  if(!config.enabled)return 'pending';
  const current=new URL(currentUrl),canonical=new URL(config.pageUrl);
  return current.origin===canonical.origin&&current.pathname===canonical.pathname ? 'live' : 'preview';
}
