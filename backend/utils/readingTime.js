export const calculateReadingTime =
  (content = "") => {

    const words =
      content
        .replace(/<[^>]*>/g, "")
        .trim()
        .split(/\s+/).length;

    const minutes =
      Math.max(
        1,
        Math.ceil(words / 200)
      );

    return `${minutes} min read`;
  };