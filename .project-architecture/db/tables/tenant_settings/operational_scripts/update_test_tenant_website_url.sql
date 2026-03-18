-- Test tenant (00000000-0000-0000-0000-000000000001) website URL güncellemesi
UPDATE tenant_settings
SET website_url = 'https://sacrifice-website-git-main-solutions-projects-803fd257.vercel.app/'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
