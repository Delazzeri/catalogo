-- Banner is no longer part of the project detail experience (replaced by the
-- full-page PDF viewer); Open Graph metadata now uses cover_image_url instead.
alter table public.projects drop column banner_image_url;
