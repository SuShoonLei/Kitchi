-- The moment a pantry item becomes USED, WASTED, or EXPIRED.
-- Later edits must not move that item into another week.

ALTER TABLE ingredients
    ADD COLUMN status_changed_at TIMESTAMPTZ;

UPDATE ingredients
SET status_changed_at = updated_at
WHERE status_changed_at IS NULL;
