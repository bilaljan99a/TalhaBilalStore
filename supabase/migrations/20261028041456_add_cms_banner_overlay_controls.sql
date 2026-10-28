alter table public.cms_banners
  add column if not exists display_mode text not null default 'overlay'
    check (display_mode in ('overlay', 'split')),
  add column if not exists text_color text not null default '#ffffff'
    check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists text_position text not null default 'bottom-left'
    check (text_position in ('top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right')),
  add column if not exists button_position text not null default 'bottom-right'
    check (button_position in ('top-left', 'top-right', 'bottom-left', 'bottom-right'));
