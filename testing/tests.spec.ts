import { test, expect } from '@playwright/test';

test('Check that traffic and weather cards are visible', async ({ page }) => {
  await page.goto("http://localhost:5500");

  const trafficCard = page.locator('.data-card-traffic');
  const weatherCard = page.locator('.data-card-weather');

  await expect(trafficCard).toBeVisible();
  await expect(weatherCard).toBeVisible();
});

test("Check that chat is visible and is working", async ({ page }) => {
    await page.goto("http://localhost:5500");

    const chatBox = page.locator(".chat-box");

    await expect(chatBox).toBeVisible();

    const input = "Hello, this is a test message!";
    const inputField = page.locator(".chat-input input");
    await inputField.fill(input);
    await inputField.press("Enter");

    const lastMessage = chatBox.locator(".message").last();
    await expect(lastMessage).toHaveText("You" + input);
})

test("Check that other clients can see the chat", async ({ page }) => {
    await page.goto("http://localhost:5500");

    const chatBox = page.locator(".chat-box");

    await expect(chatBox).toBeVisible();

    const input = "Hello, this is a test message!";

    const lastMessage = chatBox.locator(".message-away").last();
    await expect(lastMessage).toHaveText("User" + input);
})