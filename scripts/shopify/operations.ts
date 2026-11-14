// Every Admin API operation scripts/shopify-setup.ts runs. `npm run shopify:validate` checks
// each one against the Admin API schema (API_VERSION) with the Shopify AI Toolkit in skills/shopify.

export const SHOP = `#graphql
  query FireboxShop {
    shop { name myshopifyDomain currencyCode }
  }
`;

export const DEFINITIONS = `#graphql
  query FireboxDefinitions {
    productDefs: metafieldDefinitions(first: 50, namespace: "firebox", ownerType: PRODUCT) {
      nodes { id key type { name } }
    }
    collectionDefs: metafieldDefinitions(first: 50, namespace: "firebox", ownerType: COLLECTION) {
      nodes { id key type { name } }
    }
    metaobjectDefinitions(first: 50) {
      nodes { id type fieldDefinitions { key type { name } } }
    }
  }
`;

export const METAFIELD_DEFINITION_CREATE = `#graphql
  mutation FireboxMetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key namespace }
      userErrors { field message code }
    }
  }
`;

export const METAFIELD_DEFINITION_UPDATE = `#graphql
  mutation FireboxMetafieldDefinitionUpdate($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition { id key namespace }
      userErrors { field message code }
    }
  }
`;

export const METAOBJECT_DEFINITION_CREATE = `#graphql
  mutation FireboxMetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }
`;

export const METAOBJECT_DEFINITION_UPDATE = `#graphql
  mutation FireboxMetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }
`;

export const FIND_FILE = `#graphql
  query FireboxFindFile($query: String!) {
    files(first: 5, query: $query) { nodes { id fileStatus ... on MediaImage { image { url } } } }
  }
`;

export const FIND_COLLECTION = `#graphql
  query FireboxFindCollection($handle: String!) {
    collectionByIdentifier(identifier: {handle: $handle}) { id handle }
  }
`;

export const COLLECTION_CREATE = `#graphql
  mutation FireboxCollectionCreate($collection: CollectionCreateInput!) {
    collectionCreate(collection: $collection) {
      collection { id handle }
      userErrors { field message }
    }
  }
`;

export const COLLECTION_REORDER = `#graphql
  mutation FireboxCollectionReorder($id: ID!, $moves: [MoveInput!]!) {
    collectionReorderProducts(id: $id, moves: $moves) {
      job { id }
      userErrors { field message }
    }
  }
`;

export const FIND_PRODUCT = `#graphql
  query FireboxFindProduct($handle: String!) {
    productByIdentifier(identifier: {handle: $handle}) { id handle media(first: 1) { nodes { id } } }
  }
`;

export const PRODUCT_SET = `#graphql
  mutation FireboxProductSet($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
    productSet(synchronous: true, input: $input, identifier: $identifier) {
      product { id handle }
      userErrors { field message code }
    }
  }
`;

export const ATTACH_FILE = `#graphql
  mutation FireboxAttachFile($files: [FileUpdateInput!]!) {
    fileUpdate(files: $files) {
      files { id }
      userErrors { field message code }
    }
  }
`;

export const PUBLICATIONS = `#graphql
  query FireboxPublications {
    publications(first: 25) {
      nodes {
        id
        catalog { title ... on AppCatalog { apps(first: 5) { nodes { handle title } } } }
      }
    }
  }
`;

export const PUBLISH = `#graphql
  mutation FireboxPublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

export const FIND_METAOBJECT = `#graphql
  query FireboxFindMetaobject($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) { id handle fields { key value } }
  }
`;

export const METAOBJECT_UPSERT = `#graphql
  mutation FireboxMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`;

export const OPERATIONS = {
  SHOP,
  DEFINITIONS,
  METAFIELD_DEFINITION_CREATE,
  METAFIELD_DEFINITION_UPDATE,
  METAOBJECT_DEFINITION_CREATE,
  METAOBJECT_DEFINITION_UPDATE,
  FIND_FILE,
  FIND_COLLECTION,
  COLLECTION_CREATE,
  COLLECTION_REORDER,
  FIND_PRODUCT,
  PRODUCT_SET,
  ATTACH_FILE,
  PUBLICATIONS,
  PUBLISH,
  FIND_METAOBJECT,
  METAOBJECT_UPSERT,
};
