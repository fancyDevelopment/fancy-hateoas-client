# fancy-hateoas-client
A client to interact with HATEOAS resources.

If you provide resources from your web api with hypermedia containing links to related resources as well as information about possible actions on your resource, then this library makes interacting with your web api as simple as possible.

> In case you want to use this within an Angular project have a look to [fancy-ngx-hateoas-client](https://github.com/fancyDevelopment/fancy-ngx-hateoas-client)

## Expected Document
The library expects that your web api provides metadata about related resources in a key called `_links` and metadata about possible actions in a key called `actions`.

See the following document for an example:

```json
{
    "_links": {
        "self": { "href": "http://myapp.dom.tld/resource" },
        "linkedResource": { "href": "http://myapp.dom.tld/linked-resource" }
    },
    "_actions": {
        "update": { "method": "PUT", "href": "http://myapp.dom.tld/resource"}
    },
    "stringProp": "foo",
    "subObj": {
        "numProp": 5, 
        "_links": {
            "subObjLinkedResource": { "href": "http://myapp.dom.tld/su-obj-linked-resource" }
        },
        "_actions": {
            "create": { "href": "http://myapp.dom.tld/resource/sub-obj", "method": "POST"}
        }
    }
}
```

> To easily create json objects conaining hypermedia as shown in the example above have a look to the following project: [Fancy.ResourceLinker](https://github.com/fancyDevelopment/Fancy.ResourceLinker)

## Working with Hypermedia Resources
The following steps describe the usage of the Hateoas Client based on the example document showed above.

### Retrieving the Initial Resource
To retrieve a initial resource from your server create create an instance of the `HateoasClient` and use the fetch method.

```ts
const hateoasClient = createDefaultHateoasClient();
const resource = await hateoasClient.fetch("http://myapp.dom.tld/resource");
```

### Retrieving a Linked Resource
For each key within a `_link` key in your document the library automatically generates a function with the following pattern: `fetch_` + `key of _link`. E.g. your link object has a key `linkedResource` than a fetch function is generated with name: `fetch_linkedResource` on the same hierarchy level as the corresponding `_links` key.

To retrieve a linked resource of a resource you already fetched you can use fetch functions automatically generated for you by the `HateoasClient`. 

The following line executes a http request with the verb `GET` to `http://myapp.dom.tld/linked-resource`.

```ts
const linkedResource = await resource.fetch_linkedResource();
```

If you would like to add some query params to your call to the server you can provide an optional object where the library attaches the key/value pairs as query params to the request. 

The following line executes a http request with the verb `GET` to `http://myapp.dom.tld/linked-resource?foo=bar&otherProp=5`.

```ts
const linkedResource = await resource.fetch_linkedResource({foo: 'bar', otherProp: 5});
```

If you have `_link` keys also deeper within the hierarchy of your resource you can also call those:

```ts
const linkedResource = await resource.subObj.fetch_subObjLinkedResource();
```

### Calling Actions
For each key within an `_actions` key in your document the library automatically generates a function with the same name as the key. E.g. your actions object has a key `update` than a function is generated with name: `update` on the same hierarchy level as the corresponding `_actions` key.

If you call an action function which has the `PUT` or `POST` verb specified in the `method` key, than it sends the object on its same level with all levels below excluding hypermedia to the server. 

The following example leads to a call to `PUT http://myapp.dom.tld/resource` with the body `{stringProp: "foo", subObj: {numProp: 5}}`.

```ts
await resource.update();
```

The following example leads to a call to `POST http://myapp.dom.tld/resource` with the body `{numProp: 5}`.

```ts
await resource.subObj.create();
```

If you specify the `DELETE` verb the client sends an empty body as specified by the standards.