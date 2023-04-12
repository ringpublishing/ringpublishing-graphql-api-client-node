import { RingGqlApiType, RingGqlClientBuilder } from './client-builder';

export class WebsitesApiClientBuilder extends RingGqlClientBuilder {
    protected readonly apiType = RingGqlApiType.WEBSITES;

    protected readonly apiVersion = 2;
}
