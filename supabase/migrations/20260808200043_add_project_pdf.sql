-- Adds PDF detail-view support to projects: URL + cached metadata to avoid
-- opening the PDF client-side just to know page count / aspect ratio.
alter table public.projects
  add column pdf_url text,
  add column pdf_page_count integer,
  add column pdf_page_aspect_ratio real;

comment on column public.projects.pdf_url is
  'Public URL of the detail-view PDF in Supabase Storage. Null while a draft has no PDF yet; a project without pdf_url is not navigable (card renders non-clickable).';
comment on column public.projects.pdf_page_count is
  'Cached page count of pdf_url, extracted client-side on upload. Used to size page placeholders before pdf.js loads.';
comment on column public.projects.pdf_page_aspect_ratio is
  'Cached width/height ratio of the first PDF page. Used with pdf_page_count to estimate per-page wrapper height and avoid layout shift.';

alter table public.projects
  add constraint projects_pdf_page_count_check check (pdf_page_count is null or pdf_page_count > 0),
  add constraint projects_pdf_page_aspect_ratio_check check (pdf_page_aspect_ratio is null or pdf_page_aspect_ratio > 0);
