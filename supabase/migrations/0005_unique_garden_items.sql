-- Each garden item/animal can only be bought once per group.
alter table group_items
  add constraint group_items_group_id_item_key_key unique (group_id, item_key);
