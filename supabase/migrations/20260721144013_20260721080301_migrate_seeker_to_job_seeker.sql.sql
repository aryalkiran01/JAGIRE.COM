-- Migrate existing 'seeker' roles to 'job_seeker'
UPDATE user_roles SET role = 'job_seeker' WHERE role = 'seeker';
