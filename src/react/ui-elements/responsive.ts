/* Container width below which a table row's action buttons drop their labels for their icon.
   A row action sits in a column far narrower than the page, so it runs out of room long before
   the toolbar does and has to collapse while the page is still wide. 760 is just under the
   768px content box this work targets — the width left when the side drawer opens on a 1268px
   browser — so the row actions are already icons for the whole of that case. */
export const ROW_ACTION_ICON_ONLY_BELOW = 760;

/* Container width below which a list toolbar's action buttons drop their labels. Far lower than
   the row actions': a toolbar action has the whole page width to sit in, so collapsing it at
   the row threshold takes the labels away while ~140px of the row is still empty.
   Measured on Accounts, the busiest toolbar (two actions): 32px row padding + the search box at
   its 139px floor + 16px gap + Start Veeam VBR Assistant at 237px + 16px gap + Create Account
   at 179px = 619px before anything has to give. Kept 620. Toolbars with one narrower action
   have room to spare at that point and collapse later than they strictly must, which is the
   price of one threshold the whole app shares. */
export const TOOLBAR_ACTION_ICON_ONLY_BELOW = 620;

/* Style for a wrapper placed between a FormGroup's `content` and the control inside it.
   A FormGroup whose help or error sits below left-aligns its field cell, so that a control
   sized only by its own attributes — a TextArea with `cols`, an Input with `size="1/3"` —
   keeps that size instead of growing to fill the fluid field column. A wrapper inherits
   that alignment and shrinks to its content, which pins a full-width Input inside it to
   its intrinsic width and stops it shrinking with the column. Wrappers holding a control
   that is meant to span the column opt back into stretching with this. */
export const FIELD_CONTENT_STRETCH = { alignSelf: 'stretch', minWidth: 0 } as const;
