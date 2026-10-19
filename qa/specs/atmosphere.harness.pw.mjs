import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/qa/harness/atmosphere.html');});
test('calibration compares two real canvas previews and persists selections',async({page})=>{
 await expect(page.getByRole('heading',{name:'Personalize My Atmosphere'})).toBeVisible();
 await expect(page.locator('canvas')).toHaveCount(4);
 await page.getByRole('button',{name:'Choose A'}).click();
 await expect(page.getByText('1 comparisons saved.')).toBeVisible();
 await page.reload();
 await expect(page.getByText('1 comparisons saved.')).toBeVisible();
 await page.getByRole('button',{name:'Apply recommendation'}).click();
 await expect(page.getByText(/Applied: .*detail/)).toBeVisible();
 await page.reload();
 await expect(page.getByText(/Applied: .*detail/)).toBeVisible();
});
test('manual override, reset and deletion work',async({page})=>{
 await page.getByRole('button',{name:'Choose B'}).click();
 await page.getByLabel('Color palette').selectOption('forest');
 await page.getByRole('button',{name:'Apply manual settings'}).click();
 await expect(page.getByText(/Applied: forest/)).toBeVisible();
 await page.getByRole('button',{name:'Reset calibration'}).click();
 await expect(page.getByText('0 comparisons saved.')).toBeVisible();
 await page.getByRole('button',{name:'Delete profile'}).click();
 await page.getByRole('button',{name:'Confirm delete'}).click();
 await expect(page.getByText('Applied: None (default AIM appearance)')).toBeVisible();
});
test('phone viewport stays within bounds',async({page})=>{
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
