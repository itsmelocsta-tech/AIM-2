import { expect, test } from '@playwright/test';

test('AIM alarm controls persist, cancel, restore, and deliver a finish alert', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-06T00:00:00Z') });
  await page.goto('/e2e/harness/');

  const primary = page.getByTestId('primary-task');
  await expect(primary.getByRole('button', { name: 'I’m doing it · 30-minute activity' })).toBeVisible();
  await primary.getByRole('button', { name: 'I’m doing it · 30-minute activity' }).click();
  const clock = page.getByLabel('AIM alarm clock');
  await expect(clock).toContainText('AIM Clock · Finish Complete the planned illustration practice');
  const beforeReload = await clock.getByText(/AIM Clock · Finish/).innerText();
  await page.screenshot({ path: testInfo.outputPath('alarm-before-reload.png'), fullPage: true });

  await page.reload();
  await expect(primary.getByText('Activity in progress')).toBeVisible();
  await expect(clock.getByText(beforeReload, { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('alarm-after-reload.png'), fullPage: true });

  await page.getByRole('button', { name: 'Daily Planner' }).click();
  await expect(page.getByRole('checkbox', { name: 'Start alert' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Finish alert' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel alarms' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('planner-alarm-controls.png'), fullPage: true });

  await page.getByRole('button', { name: 'Home' }).click();
  await primary.getByRole('button', { name: 'Cancel alarms' }).click();
  await expect(clock).toHaveCount(0);
  await expect(primary.getByRole('button', { name: 'I’m doing it · set alarms' })).toBeVisible();
  await primary.getByRole('button', { name: 'I’m doing it · set alarms' }).click();
  await expect(clock.getByText(beforeReload, { exact: true })).toBeVisible();

  const oneMinute = page.getByTestId('one-minute-task');
  await oneMinute.getByRole('button', { name: 'I’m doing it · 1-minute activity' }).click();
  await page.clock.fastForward(61_000);
  const alert = page.getByRole('alertdialog');
  await expect(alert.getByRole('heading', { name: 'Time to wrap up' })).toBeVisible();
  await expect(alert).toContainText('Complete a one-minute line exercise');
  await page.screenshot({ path: testInfo.outputPath('one-minute-finish-alert.png'), fullPage: true });
  await alert.getByRole('button', { name: 'Dismiss alarm' }).click();
  await expect(alert).toHaveCount(0);
});
