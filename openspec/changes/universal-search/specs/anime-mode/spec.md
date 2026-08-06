## REMOVED Requirements

### Requirement: Anime toggle on the Search page

**Reason**: Search is now universal. The app expanded from anime-only to all genres, and universal search returns any-language results from the header box and the results page. Anime discovery is retained on the Home page ("Trending Anime" / "Top Anime" sections), and the server `anime` query parameter plus `/films/anime` browse endpoint remain for API compatibility and Home usage.

**Migration**: The client no longer renders the anime toggle on the search results page. Users searching for anime can rely on Home's anime sections or simply search by title (results are no longer language-filtered).
