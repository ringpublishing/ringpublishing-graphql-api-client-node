import { RingGqlApiType, RingGqlClientBuilder } from './client-builder';

export class ContentApiClientBuilder extends RingGqlClientBuilder {
    protected readonly apiType = RingGqlApiType.CONTENT;

    protected readonly apiVersion = 2;
}
