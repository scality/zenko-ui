/* Container width below which a table row's action button collapses to icon-only — it sits in
   a column far narrower than the page, so it gives way first. 760 is just under the 768px
   content box this work targets: a 500px side drawer open on a 1268px browser. */
export const ROW_ACTION_ICON_ONLY_BELOW = 760;

/* Container width below which a toolbar's actions collapse to icon-only — lower than the row
   threshold, since a toolbar spans the whole page. Busiest toolbar, two actions: 32 padding +
   139 search floor + 16 + 237 + 16 + 179 = 619px before anything gives. Kept 620. */
export const TOOLBAR_ACTION_ICON_ONLY_BELOW = 620;

/* Applied to a wrapper between FormGroup's `content` and its control. FormGroup left-aligns
   the field cell when help/error sits below, which stops an intrinsically-sized control (or a
   wrapper around one) from growing with the column; this re-opts it into stretching. */
export const FIELD_CONTENT_STRETCH = { alignSelf: 'stretch', minWidth: 0 } as const;

/* Container width below which a panel's own action buttons collapse to icon-only. Set to the
   768px content box itself: panel actions sit beside a header title, so they give way sooner
   than a toolbar action would. */
export const PANEL_ACTION_ICON_ONLY_BELOW = 768;

/* Container width below which an editor's aside — its copy button and any note beside it —
   moves under the editor instead of sitting next to it. The editor is the field's whole
   point, so the aside is what gives way; below this the two side by side leave the editor
   too narrow to read a line of JSON in. */
export const EDITOR_ASIDE_STACK_AT = 540;
