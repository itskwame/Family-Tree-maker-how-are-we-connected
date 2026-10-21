# Hosted migration review candidates

DRAFT ONLY. Do not execute against hosted Supabase. Read [migration plan](../../HOSTED-BETA-MIGRATION-PLAN.md) and resolve blockers. Copies retain local-only headers; no deployment runner is included. Quarantine requires consumer review. No seed or data-import file is included.

| Order | SQL | SHA-256 |
| --- | --- | --- |
| 0 | [20261021000000_quarantine_legacy.sql](20261021000000_quarantine_legacy.sql) | `d07bb6261cdc08da38780a4cb8ea7af831469e4aa5fcc704072f095d9c92dbd3` |
| 1 | [20261021000100_familyconnect_baseline.sql](20261021000100_familyconnect_baseline.sql) | `22e8d5c74d7c6007a2fc77a9f485038ffa4522d0d58e34aae0f08757daf30632` |
| 2 | [20261021000200_guardians_and_identity.sql](20261021000200_guardians_and_identity.sql) | `4472855f524d579cd19adbc339f9768f2e5dc27f463097237cda472411aa287c` |
| 3 | [20261021000300_claim_review.sql](20261021000300_claim_review.sql) | `9097e0f2c0782c67f8e747b425e8a7970e5b3f20e7d1d669161453fc80f720fc` |
| 4 | [20261021000400_per_network_reveal.sql](20261021000400_per_network_reveal.sql) | `aa89daa5f670130a95c87428cfa55c19de18925ba2712b5bbac7c6a7670bddc3` |
| 5 | [20261021000500_partnership_semantics.sql](20261021000500_partnership_semantics.sql) | `17500e7945fc35b34b8cca3e4171de2c9a314fd3db4c71d622f50baf092e6dd2` |
| 6 | [20261021000600_guided_builder.sql](20261021000600_guided_builder.sql) | `5c10453b2dd9ed901b6061e7256a1772a9b46469238571ed625d08c032122eb9` |
| 7 | [20261021000700_invitation_portrait_path.sql](20261021000700_invitation_portrait_path.sql) | `92f4c86d1017e26be26dfd94b99287dc12108bde770bbc884f2809e5a04b2a27` |
| 8 | [20261021000800_social.sql](20261021000800_social.sql) | `7a18f4244eecc42e600a24da20e1c41991e30630f9c516371697a782be518aac` |
| 9 | [20261021000900_social_notification_guard.sql](20261021000900_social_notification_guard.sql) | `bf65703442ff83ae4424c43b4a5feea11e2a0061740b4eefaca25cf4e1fde7a1` |
| 10 | [20261021001000_social_pagination.sql](20261021001000_social_pagination.sql) | `908f7f2f4f31e76bd717c729d054b7d0092b029024b0cef835d0ef75f98c0c34` |
| 11 | [20261021001100_social_retention.sql](20261021001100_social_retention.sql) | `fd8f550f74d0181ecfa6793aa5a393b9993364da9095bfcdb819d91fc5d66fd5` |
| 12 | [20261021001200_storage_exact_path.sql](20261021001200_storage_exact_path.sql) | `63e7cf5388bfb94288039fd8840978ff5624d0c53ede014144b9859612f3e958` |
| 13 | [20261021001300_media_finalize_and_message_deletion.sql](20261021001300_media_finalize_and_message_deletion.sql) | `fd9f51aab9d319aec7632d5534fb34fe060e3b2ce7344a12996a36c2cef9e691` |
| 14 | [20261021001400_family_businesses.sql](20261021001400_family_businesses.sql) | `18c4aff74c5803db25c7b0f4678cc65397dcdc8c06920361954db0da6d2d7509` |
| 15 | [20261021001500_business_private_projection.sql](20261021001500_business_private_projection.sql) | `288fac7f19b80ae2e564f229d163dabfff13756d71c08271fa3a4dd1507e3138` |
