export const slugify = (text = "") => {

  return text
    .toString()
    .toLowerCase()
    .trim()

    // remove special chars
    .replace(/[^\w\s-]/g, "")

    // spaces to hyphen
    .replace(/\s+/g, "-")

    // remove repeated hyphens
    .replace(/--+/g, "-")

    // trim hyphens
    .replace(/^-+|-+$/g, "");
};