-- ============================================================
-- Account settings — username change counter
--
-- The /profile About tab lets a user edit their username at most
-- twice in a lifetime. We track the count on the `User` row so the
-- PATCH /users/me handler can hard-cap it before mutating.
-- ============================================================

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "usernameChangedCount" INTEGER NOT NULL DEFAULT 0;
