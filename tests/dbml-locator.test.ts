import { describe, expect, it } from "vitest";
import {
  findDbmlColumnLine,
  findDbmlTableLine,
} from "../lib/engine/dbml-locator";

describe("DBML Locator", () => {
  const sampleDbml = `
Table users as U {
  id integer [pk, increment]
  username varchar(50) [not null, unique]
  email varchar(100) [not null, unique]

  indexes {
    (email) [unique]
  }
}

Table public.orders {
  order_id integer [pk]
  user_id integer [not null]
  total decimal(10,2)
}

Table "order items" {
  "item id" integer [pk]
  quantity integer
}
`.trim();

  it("locates table lines accurately", () => {
    // 'Table users as U' is at line 1
    expect(findDbmlTableLine(sampleDbml, "users")).toBe(1);
    // 'Table public.orders' is at line 11
    expect(findDbmlTableLine(sampleDbml, "orders")).toBe(11);
    // 'Table "order items"' is at line 17
    expect(findDbmlTableLine(sampleDbml, "order items")).toBe(17);
    // fallback for unknown table
    expect(findDbmlTableLine(sampleDbml, "non_existent")).toBe(1);
  });

  it("locates column lines within tables accurately", () => {
    // inside users
    expect(findDbmlColumnLine(sampleDbml, "users", "id")).toBe(2);
    expect(findDbmlColumnLine(sampleDbml, "users", "username")).toBe(3);
    expect(findDbmlColumnLine(sampleDbml, "users", "email")).toBe(4);

    // inside orders
    expect(findDbmlColumnLine(sampleDbml, "orders", "order_id")).toBe(12);
    expect(findDbmlColumnLine(sampleDbml, "orders", "user_id")).toBe(13);
    expect(findDbmlColumnLine(sampleDbml, "orders", "total")).toBe(14);

    // inside quoted table & column
    expect(findDbmlColumnLine(sampleDbml, "order items", "item id")).toBe(18);
    expect(findDbmlColumnLine(sampleDbml, "order items", "quantity")).toBe(19);

    // non-existent column returns table line
    expect(findDbmlColumnLine(sampleDbml, "users", "not_a_col")).toBe(1);
  });
});
