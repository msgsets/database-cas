-- Folio: clips (links/text), tags, and quick notes. Unowned rows (auth off).

create table if not exists clips (
  id         serial primary key,
  kind       text not null check (kind in ('url', 'text')),
  type       text not null check (type in ('link', 'article', 'video', 'image', 'text')),
  url        text,
  title      text not null,
  excerpt    text,
  content    text,
  site_name  text,
  image_url  text,
  created_at timestamptz not null default now()
);

create index if not exists clips_created_at_idx on clips (created_at desc);
create index if not exists clips_type_idx on clips (type);

create table if not exists tags (
  id         serial primary key,
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists clip_tags (
  clip_id integer not null references clips(id) on delete cascade,
  tag_id  integer not null references tags(id) on delete cascade,
  primary key (clip_id, tag_id)
);

create index if not exists clip_tags_tag_id_idx on clip_tags (tag_id);

create table if not exists notes (
  id         serial primary key,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_updated_at_idx on notes (updated_at desc);

insert into tags (name) values
  ('设计'),
  ('阅读'),
  ('灵感'),
  ('工作')
on conflict (name) do nothing;

insert into clips (kind, type, url, title, excerpt, content, site_name, image_url) values
  (
    'url',
    'article',
    'https://developer.apple.com/design/human-interface-guidelines/',
    'Human Interface Guidelines',
    'Apple 人机界面指南：排版、布局、动效与控件的完整设计原则。',
    'Apple 人机界面指南：排版、布局、动效与控件的完整设计原则。',
    'Apple',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80'
  ),
  (
    'url',
    'video',
    'https://www.youtube.com/watch?v=wLb9g_8r-mE',
    'Designed by Apple',
    '一段关于 Apple 设计理念的影像：材料、工艺，以及产品如何被使用。',
    null,
    'YouTube',
    'https://i.ytimg.com/vi/wLb9g_8r-mE/hqdefault.jpg'
  ),
  (
    'url',
    'image',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80',
    '清晨的书桌',
    '一张安静的工作台照片，适合当作图库参考。',
    null,
    'Unsplash',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80'
  ),
  (
    'url',
    'link',
    'https://www.apple.com',
    'Apple',
    'apple.com 首页。',
    null,
    'Apple',
    null
  ),
  (
    'text',
    'text',
    null,
    '关于收集',
    '先收进来，再慢慢整理。标签、时间和类型都是以后的事。',
    '先收进来，再慢慢整理。标签、时间和类型都是以后的事。不要在入口处做决定。',
    null,
    null
  );

insert into clip_tags (clip_id, tag_id)
select c.id, t.id
from clips c
join tags t on t.name = '设计'
where c.title in ('Human Interface Guidelines', 'Designed by Apple', '清晨的书桌');

insert into clip_tags (clip_id, tag_id)
select c.id, t.id
from clips c
join tags t on t.name = '阅读'
where c.title in ('Human Interface Guidelines', 'Apple');

insert into clip_tags (clip_id, tag_id)
select c.id, t.id
from clips c
join tags t on t.name = '灵感'
where c.title in ('Designed by Apple', '清晨的书桌');

insert into clip_tags (clip_id, tag_id)
select c.id, t.id
from clips c
join tags t on t.name = '工作'
where c.title in ('关于收集');

insert into notes (body) values
  ('下午把首页入口再收紧一点，三个入口不要抢。'),
  ('标签只在资料库里写，收入时保持轻。');
