import { RingGqlApiType, RingGqlClientBuilder } from './client-builder';

export class ModulesFrameworkApiClientBuilder extends RingGqlClientBuilder {
    protected readonly apiType = RingGqlApiType.MODULES_FRAMEWORK;

    protected readonly apiVersion = 1;
}
