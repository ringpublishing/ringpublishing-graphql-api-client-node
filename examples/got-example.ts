import { gql } from 'graphql-tag';
import { WebsitesApiClientBuilder } from '../src';
import { print, stripIgnoredCharacters } from 'graphql';

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
    data: {
        stories: {
            edges: [{
                node: {
                    title: string;
                };
            }];
        };
    };
};

(async function run(): Promise<void> {
    const client = new WebsitesApiClientBuilder({ accessKey, secretKey, spaceUuid })
        .setTimeout(2000)
        .buildGotClient();

    try {
        const body = JSON.stringify({
            query: stripIgnoredCharacters(print(query))
        });
        const response = await client.post({ body }).json<StoriesResponse>();
        console.debug(JSON.stringify(response.data.stories, null, 4));
    } catch (e) {
        console.error(e);
    }
})();
