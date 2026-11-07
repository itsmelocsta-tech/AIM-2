import { describe, it, expect } from 'vitest';
import { selectSpecialists, specialistInstruction } from './specialistRouter';
describe('single-call specialist router', () => {
 it('does not invoke specialists for casual messages',()=>expect(selectSpecialists('hello there')).toEqual([]));
 it('routes multiple topics without overloading the response',()=>expect(selectSpecialists('I have bills, stress and an argument with my partner')).toEqual(['wellness','finance']));
 it('handles non-string input safely',()=>expect(selectSpecialists(null)).toEqual([]));
 it('does not promise external actions',()=>expect(specialistInstruction('remind me tomorrow')).toContain('do not claim calendar events were created'));
});
