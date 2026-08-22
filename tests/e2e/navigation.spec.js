import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Rec Page!")).toBeVisible();
});

test("user list redirects to login when logged out", async ({ page }) => {
  await page.goto("/UserList");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("navigation links open the correct pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Book Search" }).click();
  await expect(
    page.getByRole("heading", { name: "Book Search" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Movie Search" }).click();
  await expect(
    page.getByRole("heading", { name: "Movie Search" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByText("Rec Page!")).toBeVisible();
});

test("register form shows required field errors", async ({ page }) => {
  await page.goto("/Register");

  await page.locator('input[type="submit"]').click();
  await expect(page.getByText("Name is mandatory")).toBeVisible();
  await expect(page.getByText("Email is mandatory")).toBeVisible();
  await expect(
    page.getByText("Password is mandatory", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Confirm password is mandatory")).toBeVisible();
});

test("register validates password strength and confirmation", async ({
  page,
}) => {
  await page.goto("/Register");

  await page.getByPlaceholder("Name").fill("Test User");
  await page.getByPlaceholder("Email").fill("test@example.com");
  await page.getByPlaceholder("Password", { exact: true }).fill("weak");
  await page.getByPlaceholder("Confirm Password").fill("different");

  await page.locator('input[type="submit"]').click();

  await expect(
    page.getByText(/Password must be 8\+ characters/i),
  ).toBeVisible();
  await expect(page.getByText("Passwords do not match")).toBeVisible();
});

test("login form shows required field errors", async ({ page }) => {
  await page.goto("/Login");

  await page.locator('input[type="submit"]').click();

  await expect(page.getByText("*Email* is mandatory")).toBeVisible();
  await expect(page.getByText("*Password* is required!")).toBeVisible();
});

test("chatbot opens automatically on first session visit", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();

  const chatWindow = page.getByRole("region", {
    name: "Recommendation assistant",
  });

  await expect(chatWindow).toBeVisible();

  await expect(
    page.getByText("Hi, I can help with recommendations based on your list."),
  ).toBeVisible();
});

test("chatbot toggles open and closed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();

  const chatWindow = page.getByRole("region", {
    name: "Recommendation assistant",
  });

  await expect(chatWindow).toBeVisible();
  await page.getByLabel("Close assistant").click();
  await expect(chatWindow).not.toBeVisible();

  await page.getByLabel("Toggle recommendation assistant").click();
  await expect(chatWindow).toBeVisible();
});

test("chatbot asks logged-out users to log in", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.evaluate(() => localStorage.removeItem("token"));

  const chatWindow = page.getByRole("region", {
    name: "Recommendation assistant",
  });

  await expect(chatWindow).toBeVisible();
  await page
    .getByPlaceholder("Ask for recommendations!")
    .fill("Recommend anime like Death Note");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(
    page.getByText("Please log in to use personalized recommendations!"),
  ).toBeVisible();
});

test("book search renders mocked book result", async ({ page }) => {
  await page.route(
    "https://www.googleapis.com/books/v1/volumes**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "book-1",
              volumeInfo: {
                title: "Mock Book",
                authors: ["Mock Author"],
                canonicalVolumeLink: "mock-book-link",
                imageLinks: {
                  thumbnail: "https://example.com/book.jpg",
                },
                publishedDate: "2020",
              },
            },
          ],
        }),
      });
    },
  );

  await page.goto("/BookSearch");
  await page.locator('input[name="query"]').fill("mock");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText("Mock Book")).toBeVisible();
  await expect(page.getByText("Author: Mock Author")).toBeVisible();
});

test("movie search renders mocked movie result", async ({ page }) => {
  await page.route(
    "https://api.themoviedb.org/3/search/multi**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 123,
              media_type: "movie",
              title: "Mock Movie",
              release_date: "2021-01-01",
              vote_average: 8.4,
              poster_path: null,
            },
          ],
        }),
      });
    },
  );

  await page.goto("/MovieSearch");
  await page.getByPlaceholder("Search").fill("mock");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText("Mock Movie")).toBeVisible();
  await expect(page.getByText("Released:")).toBeVisible();
  await expect(page.getByText(/8\.4/)).toBeVisible();
});

test("user list renders mocked saved media with blank user score", async ({
  page,
}) => {
  await page.route("**/api/media-list", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          title: "Saved Mock Movie",
          media_type: "movie",
          release_date: "2022-01-01",
          rating: 9.1,
          image_url: null,
        },
      ]),
    });
  });

  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("token", "fake-token"));

  await page.goto("/UserList");

  await expect(page.getByText("Saved Mock Movie")).toBeVisible();
  await expect(page.getByText("9.1")).toBeVisible();
  await expect(page.getByLabel("Score for Saved Mock Movie")).toHaveValue("");
});

test("adding mocked movie sends media-list POST request", async ({ page }) => {
  await page.route(
    "https://api.themoviedb.org/3/search/multi**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 123,
              media_type: "movie",
              title: "Mock Movie",
              release_date: "2021-01-01",
              vote_average: 8.4,
              poster_path: null,
            },
          ],
        }),
      });
    },
  );

  let postBody;
  let authHeader;

  await page.route("**/api/media-list", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    postBody = route.request().postDataJSON();
    authHeader = route.request().headers().authorization;

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(postBody),
    });
  });

  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("token", "fake-token"));

  await page.goto("/MovieSearch");
  await page.getByPlaceholder("Search").fill("mock");
  await page.getByRole("button", { name: "Search" }).click();

  await page.getByRole("button", { name: "Add to list" }).click();
  await expect.poll(() => postBody).not.toBeUndefined();

  expect(postBody.title).toBe("Mock Movie");
  expect(postBody.media_type).toBe("movie");
  expect(postBody.external_source).toBe("tmdb");
  expect(postBody.external_id).toBe("123");
  expect(authHeader).toBe("Bearer fake-token");
});

test("adding mocked book sends media-list POST request", async ({ page }) => {
  await page.route(
    "https://www.googleapis.com/books/v1/volumes**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "book-1",
              volumeInfo: {
                title: "Mock Book",
                authors: ["Mock Author"],
                canonicalVolumeLink: "mock-book-link",
                imageLinks: {
                  thumbnail: "https://example.com/book.jpg",
                },
                publishedDate: "2020",
              },
            },
          ],
        }),
      });
    },
  );

  let postBody;
  let authHeader;

  await page.route("**/api/media-list", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    postBody = route.request().postDataJSON();
    authHeader = route.request().headers().authorization;

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(postBody),
    });
  });

  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("token", "fake-token"));

  await page.goto("/BookSearch");
  await page.locator('input[name="query"]').fill("mock");
  await page.getByRole("button", { name: "Search" }).click();

  await page.getByRole("button", { name: "Add to list" }).click();
  await expect.poll(() => postBody).not.toBeUndefined();

  expect(postBody.title).toBe("Mock Book");
  expect(postBody.media_type).toBe("book");
  expect(postBody.external_source).toBe("Google Books");
  expect(postBody.external_id).toBe("book-1");
  expect(authHeader).toBe("Bearer fake-token");
});
