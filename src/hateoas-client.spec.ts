import { HateoasClient } from './hateoas-client';
import { RequestManager } from './request-manager';
import { ResourceBase } from './resource';

// Set up url for test resources
const testResourceUrl = 'http://myapp.dom.tld/resource';
const linkedResourceUrl = 'http://myapp.dom.tld/linkedResource';

// Set up test documents
const testResourceDocument = {
    _links: {
        self: { href: testResourceUrl },
        linkedResource: { href: linkedResourceUrl }
    },
    _actions: {
        update: { method: 'POST', href: testResourceUrl}
    }
}

const linkedResourceDocument = {
    _links: {
        self: { href: linkedResourceUrl }
    }
}

// Set up a request manager used for testing the hateoas client
class TestRequestManager extends RequestManager {
    protected request(method: 'GET' | 'PUT' | 'POST' | 'DELETE', url: string, body?: any): Promise<any> {
        if(method === 'GET' && url === testResourceUrl) {
            return Promise.resolve(testResourceDocument);
        } else if(method === 'GET' && url === linkedResourceUrl) {
            return Promise.resolve(linkedResourceDocument);
        } else if(method === 'GET' && url === linkedResourceUrl + '?foo=bar') {
            return Promise.resolve( { ...linkedResourceDocument, foo: 'bar' });
        } else if(method === 'GET' && url === linkedResourceUrl + '?foo=bar&foobi=bari') {
            return Promise.resolve( { ...linkedResourceDocument, foo: 'bar', foobi: 'bari' });
        } else {
            return Promise.resolve(null);
        }
    }
}

describe('HateoasClient', () => {
    let testRequestManager: RequestManager;
    let target: HateoasClient;

    beforeEach(() => {
        testRequestManager = new TestRequestManager();
        target = new HateoasClient(testRequestManager);
        jest.spyOn(TestRequestManager.prototype, 'fetch');
    });

    test('can be created', () => {
        expect(target).toBeDefined();
    });

    test('creates fetch functions', async () => {
        let testResource = await target.fetch(testResourceUrl) as ResourceBase;

        // Validate all things that need to happen of fetching a resource directly
        expect(testResource).toBeDefined();
        expect(testResource._links?.['self']?.href).toBe(testResourceUrl);
        expect(typeof testResource._links?.['self']?.fetch).toBe('function');
        expect(testResource._links?.['linkedResource']?.href).toBe(linkedResourceUrl);
        expect(typeof testResource._links?.['linkedResource']?.fetch).toBe('function');
        expect(typeof testResource.fetch_self).toBe('function');
        expect(typeof testResource.fetch_linkedResource).toBe('function');

        let linkedResource = await testResource.fetch_linkedResource() as ResourceBase;

        // Validate all things that need to happen on fetching a linked resource
        expect(testRequestManager.fetch).toHaveBeenCalledWith(linkedResourceUrl);

        expect(linkedResource).toBeDefined();
        expect(linkedResource._links?.['self']?.href).toBe(linkedResourceUrl);
        expect(typeof linkedResource._links?.['self']?.fetch).toBe('function');
        expect(typeof linkedResource.fetch_self).toBe('function');

        // Validate query string generation
        linkedResource._links?.['self']?.fetch?.();
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl);
        linkedResource.fetch_self();
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl);
        linkedResource._links?.['self']?.fetch?.({foo: 'bar'});
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl + '?foo=bar');
        linkedResource.fetch_self({foo: 'bar'});
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl + '?foo=bar');
        linkedResource._links?.['self']?.fetch?.({foo: 'bar', foobi: 'bari'});
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl + '?foo=bar&foobi=bari');
        linkedResource.fetch_self({foo: 'bar', foobi: 'bari'});
        expect(testRequestManager.fetch).lastCalledWith(linkedResourceUrl + '?foo=bar&foobi=bari');
    });
});