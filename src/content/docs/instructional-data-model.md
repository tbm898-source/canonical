# Instructional Data Model

Six entities support the CANONICAL instructional system.

## Entities

- **CanonicalMaterialRequest** — A request for the operator to generate classroom or PRISM material packs
- **CanonicalGeneratedArtifact** — A generated curriculum, slide, handout, quiz, or operator artifact
- **CanonicalClassSession** — A scheduled or completed class session
- **CanonicalEvidenceNote** — A structured note for documenting class evidence and observations
- **CanonicalRailPolicy** — A durable policy record defining rail separation and attribution rules
- **CanonicalTemplateProfile** — A reusable template or visual/profile rule for slides and packets

## Rail separation

AYA Classroom artifacts and PRISM Framework artifacts are separated at the entity level. Mixed artifacts are allowed but must be explicitly tagged.

## Access control

Each entity enforces row-level security. Owners see their own records. Admins see all. Public artifacts are readable by anyone.