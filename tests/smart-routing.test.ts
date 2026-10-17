import { describe, expect, it } from "vitest";
import {
  computeSmartEdges,
  extractColumnName,
} from "../lib/diagram/smart-routing";
import type { RelationDefinition } from "../lib/types/schema";

describe("Smart Edge Routing Engine", () => {
  it("extracts clean column names from handle IDs", () => {
    expect(extractColumnName("user_id-right")).toBe("user_id");
    expect(extractColumnName("category_id-left")).toBe("category_id");
    expect(extractColumnName("id")).toBe("id");
    expect(extractColumnName(null)).toBe("");
    expect(extractColumnName(undefined)).toBe("");
  });

  it("routes edge from right to left when source table is to the left of target table", () => {
    const relations: RelationDefinition[] = [
      {
        id: "rel-1",
        sourceTable: "posts",
        sourceColumn: "user_id",
        targetTable: "users",
        targetColumn: "id",
        cardinality: "many-to-one",
      },
    ];

    const nodes = [
      { id: "posts", position: { x: 100, y: 100 }, measured: { width: 260 } },
      { id: "users", position: { x: 500, y: 100 }, measured: { width: 260 } },
    ];

    const edges = computeSmartEdges(relations, nodes);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("posts");
    expect(edges[0].sourceHandle).toBe("user_id-right");
    expect(edges[0].target).toBe("users");
    expect(edges[0].targetHandle).toBe("id-left");
    expect(edges[0].data?.inverted).toBe(false);
  });

  it("dynamically flips handles to nearest facing sides when source table is to the right of target table", () => {
    // Like categories (left) and post_categories (right)
    const relations: RelationDefinition[] = [
      {
        id: "rel-2",
        sourceTable: "post_categories",
        sourceColumn: "category_id",
        targetTable: "categories",
        targetColumn: "id",
        cardinality: "many-to-one",
      },
    ];

    const nodes = [
      {
        id: "categories",
        position: { x: 100, y: 100 },
        measured: { width: 260 },
      },
      {
        id: "post_categories",
        position: { x: 500, y: 100 },
        measured: { width: 260 },
      },
    ];

    const edges = computeSmartEdges(relations, nodes);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("post_categories");
    // post_categories is on the right, so its LEFT handle faces categories!
    expect(edges[0].sourceHandle).toBe("category_id-left");
    expect(edges[0].target).toBe("categories");
    // categories is on the left, so its RIGHT handle faces post_categories!
    expect(edges[0].targetHandle).toBe("id-right");
    // inverted flag is set so label displays 1 : N
    expect(edges[0].data?.inverted).toBe(true);
  });

  it("handles self-referencing relations with outside loop", () => {
    const relations: RelationDefinition[] = [
      {
        id: "rel-self",
        sourceTable: "users",
        sourceColumn: "parent_id",
        targetTable: "users",
        targetColumn: "id",
        cardinality: "many-to-one",
      },
    ];

    const nodes = [
      { id: "users", position: { x: 200, y: 200 }, measured: { width: 260 } },
    ];

    const edges = computeSmartEdges(relations, nodes);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("users");
    expect(edges[0].sourceHandle).toBe("parent_id-right");
    expect(edges[0].target).toBe("users");
    expect(edges[0].targetHandle).toBe("id-right");
    expect(edges[0].data?.isSelf).toBe(true);
  });

  it("connects facing sides when tables are vertically staggered", () => {
    const relations: RelationDefinition[] = [
      {
        id: "rel-staggered",
        sourceTable: "orders",
        sourceColumn: "customer_id",
        targetTable: "customers",
        targetColumn: "id",
        cardinality: "many-to-one",
      },
    ];

    const nodes = [
      { id: "orders", position: { x: 200, y: 100 }, measured: { width: 260 } },
      {
        id: "customers",
        position: { x: 210, y: 400 },
        measured: { width: 260 },
      },
    ];

    const edges = computeSmartEdges(relations, nodes);
    expect(edges).toHaveLength(1);
    // orders is at 200, customers is at 210 -> orders is to the left of customers
    expect(edges[0].sourceHandle).toBe("customer_id-right");
    expect(edges[0].targetHandle).toBe("id-left");
  });
});
