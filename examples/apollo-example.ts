import { gql } from 'graphql-tag';
import { WebsitesApiClientBuilder } from '../src';

const accessKey = process.env.ACCESS_KEY ?? '';
const secretKey = process.env.SECRET_KEY ?? '';
const spaceUuid = process.env.SPACE_UUID ?? '';

const query = gql`
    query {
        name
        stories(limit: 2) {
            edges {
                node {
                    title
                }
            }
        }
    }
`;

type StoriesResponse = {
    stories: {
        edges: [{
            node: {
                title: string;
            };
        }];
    };
};

type Variables = Record<string, unknown>;

(async function run(): Promise<void> {
    const client = new WebsitesApiClientBuilder({ accessKey, secretKey, spaceUuid })
        .setTimeout(2000)
        .buildApolloClient();
    const response = await client.query<StoriesResponse, Variables>({ query });

    console.debug(JSON.stringify(response.data.stories, null, 4));
})();
