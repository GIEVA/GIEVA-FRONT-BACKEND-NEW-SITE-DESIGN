/**
 * Professional Development (/services/professional-development) content — node 8145:8502.
 *
 * Structurally a Services-family page, not a test-registration one: two sections, each the
 * three-block about/covers/cost shape at the 24px block gap, versus the test-prep pages' single
 * section at 16px. So it reuses `ServiceDetailSection` at its default density.
 *
 * **Both sections carry HEALS placeholder copy, verbatim and identical to each other.** Their
 * "What is HEALS about" / "What HEALS covers" / "What it costs" blocks are byte-for-byte the
 * same as `/services`' HEALS section, right down to the "$100 Membership Application Fee". Only
 * the section titles ("Teacher Training", "Technology Training") are real. This is the same
 * not-yet-personalised state already documented for `/services`' Admission Processing and
 * Tuition entries and for Home's team/testimonial blocks — reproduced as-is, flagged for the
 * client in docs/consultancy-build-plan.md rather than invented around.
 *
 * Both sections' subtitles are `visible: false` in the frame, so neither is rendered.
 * The source title reads "Teacher Training " with a trailing space; trimmed (it is not
 * renderable and HTML would collapse it anyway).
 */
import type { ServiceSection } from '@lib/service-section';
import { healsBlocks } from '@lib/services-content';

export const heroTitle = 'Professional Development';

export const metaTitle = 'Professional Development — GIEVA Consultancy';
export const metaDescription =
  'GIEVA professional development — teacher training and technology training, what each covers, and what it costs.';

export const sections: ServiceSection[] = [
  { id: 'teacher-training', title: 'Teacher Training', blocks: healsBlocks },
  { id: 'technology-training', title: 'Technology Training', blocks: healsBlocks },
];

/** The CTA is SAT's copy verbatim in this frame — another placeholder, kept as found. */
export const cta = {
  body: 'Ready to sit the SAT? Let GIEVA handle the paperwork while you prepare.',
  primaryLabel: 'Register for the SAT',
};
