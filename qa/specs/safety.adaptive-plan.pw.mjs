import { test, expect } from '@playwright/test';
const analysis = time => ({ understandingSummary: ['There is less time today.'], importantLifeChange: 'Less time', categories: [], entities: [], urgency: 'medium', affectedGoalIds: [], affectedTaskIds: [], affectedTimeBlockIds: [], affectedPlanIds: [], conflictsOrUncertainty: null, planImpact: 'minor', proposedReroute: { explanation: 'Proposed short writing session', whatChanged: [], whatWasRemovedOrPaused: [], newTopPriority: '', nextSpecificAction: 'Write a paragraph', suggestedPriorityTasks: [], suggestedTimeBlocks: [{ id: 'writing', time, title: 'Write a paragraph', details: 'Open and save the draft.', completed: false }] } });
test('zero-time generation keeps existing work and uses the supplied budget', async ({ page }, info) => {
  await page.route('**/api/aim/plan', async route => {
    expect(route.request().postDataJSON().availableHours).toBe(0);
    await route.fulfill({ json: { topThreePriorityTasks: [], timeBlocks: [] } });
  });
  await page.goto('/qa/adaptive-plan-harness/');
  await page.getByRole('button', { name: 'Morning check-in', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Available productive hours' });
  await expect(slider).toHaveAttribute('min', '0'); await expect(slider).toHaveAttribute('step', '0.25');
  await slider.fill('0');
  await page.getByRole('button', { name: 'Make my daily plan', exact: true }).click();
  await expect(page.getByLabel('Plan notification')).toContainText('No new work was added');
  await expect(page.getByLabel('Saved plan state')).toContainText('Send the draft');
  await page.reload(); await expect(page.getByLabel('Saved plan state')).toContainText('Family time');
  await page.screenshot({ path: info.outputPath('zero-time-keeps-work.png'), fullPage: true });
});
for (const [name, time, valid] of [['overlap', '16:30 - 17:30', false], ['safe change', '14:00 - 14:15', true]]) {
  test(`reroute ${name} preserves existing commitments`, async ({ page }, info) => {
    await page.route('**/api/aim/life-update-analyze', route => route.fulfill({ json: analysis(time) }));
    await page.goto('/qa/adaptive-plan-harness/?reroute');
    await page.locator('textarea').first().fill('I have less time today. Help me write one paragraph.');
    await page.locator('#life-update-submit-btn').click();
    if (valid) {
      await expect(page.locator('#btn-confirm-reroute')).toBeVisible();
      await expect(page.getByLabel('Saved plan state')).not.toContainText('writing');
      await page.locator('#btn-confirm-reroute').click();
      await expect(page.getByLabel('Saved plan state')).toContainText('Write a paragraph');
      await page.reload(); await expect(page.getByLabel('Saved plan state')).toContainText('Write a paragraph');
    } else {
      await expect(page.getByText('The suggested times overlap. Your plan was not changed.', { exact: true })).toBeVisible();
      await expect(page.locator('#btn-confirm-reroute')).toHaveCount(0);
      await expect(page.getByLabel('Saved plan state')).not.toContainText('writing');
    }
    await expect(page.getByLabel('Saved plan state')).toContainText('Family time');
    await expect(page.getByLabel('Saved plan state')).toContainText('"completed":true');
    await page.screenshot({ path: info.outputPath(`reroute-${valid ? 'confirmed' : 'rejected'}.png`), fullPage: true });
  });
}
