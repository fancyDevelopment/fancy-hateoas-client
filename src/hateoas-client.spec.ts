import { HateoasClient } from './hateoas-client';

describe('HateoasClient', () => {
    test('can be created', () => {
        const target = new HateoasClient();
        expect(target).toBeDefined();
    });
});