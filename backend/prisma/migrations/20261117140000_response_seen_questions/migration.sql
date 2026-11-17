-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "seenQuestionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing responses with the question ids present at migration time.
UPDATE "Response" AS response
SET "seenQuestionIds" = COALESCE(
    (
        SELECT array_agg(elem.value->>'id')
        FROM "Survey" AS survey
        CROSS JOIN LATERAL jsonb_array_elements(survey."questions") AS elem(value)
        WHERE survey."id" = response."surveyId"
    ),
    ARRAY[]::TEXT[]
);
