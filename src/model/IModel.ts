export interface IModel {
  readonly kv: Deno.Kv;
  readonly keyName: string;

  insert(param: any): Promise<string>;

  updateById(id: string, param: any): Promise<void>;

  findById(id: string): Promise<any>;

  deleteById(id: string): Promise<void>;

  deleteAll(): Promise<void>;

  selectAll(): Promise<any>;
}
