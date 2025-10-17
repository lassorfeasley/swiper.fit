-- Check what constraints exist on account_shares table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'account_shares'::regclass
ORDER BY conname;
