import {
  DEFAULT_SEARCH_LIMIT,
  getFallbackMatches,
  getPrefixMatches,
  getSocialErrorMessage,
  normalizeLimit,
  normalizeSearchText,
  sortNewestFirst,
  uniqueById,
} from "./socialHelpers";

export async function searchUsers(searchTerm, limitValue = DEFAULT_SEARCH_LIMIT) {
  const cleanSearchTerm = normalizeSearchText(searchTerm);

  if (!cleanSearchTerm) {
    return { success: true, users: [] };
  }

  try {
    const safeLimit = normalizeLimit(limitValue);
    const prefixMatches = await getPrefixMatches(
      "users",
      "displayNameLower",
      cleanSearchTerm,
      safeLimit,
    );
    const fallbackMatches =
      prefixMatches.length >= safeLimit
        ? []
        : await getFallbackMatches(
            "users",
            (user) => {
              const displayName = normalizeSearchText(user.displayName);
              const email = normalizeSearchText(user.email);
              const bio = normalizeSearchText(user.bio);

              return (
                displayName.includes(cleanSearchTerm) ||
                email.includes(cleanSearchTerm) ||
                bio.includes(cleanSearchTerm)
              );
            },
            safeLimit,
          );
    const users = uniqueById([...prefixMatches, ...fallbackMatches]).slice(
      0,
      safeLimit,
    );

    return { success: true, users };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}

export async function searchPosts(searchTerm, limitValue = DEFAULT_SEARCH_LIMIT) {
  const cleanSearchTerm = normalizeSearchText(searchTerm);

  if (!cleanSearchTerm) {
    return { success: true, posts: [] };
  }

  try {
    const safeLimit = normalizeLimit(limitValue);
    const prefixMatches = await getPrefixMatches(
      "posts",
      "captionLower",
      cleanSearchTerm,
      safeLimit,
    );
    const fallbackMatches =
      prefixMatches.length >= safeLimit
        ? []
        : await getFallbackMatches(
            "posts",
            (post) => {
              const caption = normalizeSearchText(post.caption);
              const type = normalizeSearchText(post.type);

              return caption.includes(cleanSearchTerm) || type.includes(cleanSearchTerm);
            },
            safeLimit,
          );
    const posts = sortNewestFirst(
      uniqueById([...prefixMatches, ...fallbackMatches]),
    ).slice(0, safeLimit);

    return { success: true, posts };
  } catch (error) {
    return { success: false, error: getSocialErrorMessage(error) };
  }
}
