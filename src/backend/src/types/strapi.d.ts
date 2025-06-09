import { Strapi } from '@strapi/strapi'

// Extend the Strapi factories to accept string content types
declare module '@strapi/strapi' {
  namespace factories {
    function createCoreController(contentType: string, config?: any): any
    function createCoreRouter(contentType: string, config?: any): any
    function createCoreService(contentType: string, config?: any): any
  }
}

// Allow strapi to work with arbitrary content types
declare module '@strapi/strapi' {
  interface Strapi {
    entityService: {
      findOne(contentType: string, id: any, params?: any): Promise<any>
      findMany(contentType: string, params?: any): Promise<any[]>
      create(contentType: string, params: { data: any }): Promise<any>
      update(contentType: string, id: any, params: { data: any }): Promise<any>
      delete(contentType: string, id: any, params?: any): Promise<any>
    }
    db: {
      query(contentType: string): {
        findOne(params: any): Promise<any>
        findMany(params: any): Promise<any[]>
        create(params: any): Promise<any>
        update(params: any): Promise<any>
        delete(params: any): Promise<any>
      }
    }
    service(contentType: string): any
  }
} 