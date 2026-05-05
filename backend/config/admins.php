<?php
/**
 * Travel Pro — Admin Accounts (hardcoded)
 * --------------------------------------
 * Exactly two admins are allowed, identified by email.
 * Passwords are stored as bcrypt hashes.
 *
 * Change the emails/passwords here if you want different credentials.
 */
return [
    [
        'email' => 'admin1@travelpro.local',
        'password_hash' => '$2y$10$6VpuM0.gjPW3lyGm6kdPruKERy12CICHxTHQh1FcfJib0P4lfJmbO', // Admin@12345
        'name' => 'Admin One',
    ],
    [
        'email' => 'admin2@travelpro.local',
        'password_hash' => '$2y$10$hGHM6XoTh2TdsvJChFkOIuNq22sx4SQSu5OHlspTxSV5.YxLhm0bi', // Admin@67890
        'name' => 'Admin Two',
    ],
];

