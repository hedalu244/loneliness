export function n_array<T>(length: number, map: (v: unknown, k: number) => T): T[] {
    return Array.from({ length: length }, map)
}

export class UnionFind {
    parent: number[];
    rank: number[];

    constructor(N: number) {
        this.rank = n_array(N, () => 0);
        this.parent = n_array(N, (v, k) => k);
    }
    root(i: number): number {
        if (this.parent[i] == i)
            return i;

        const root = this.root(this.parent[i]);
        this.parent[i] = root;
        return root;
    }
    unite(a: number, b: number): void {
        a = this.root(a);
        b = this.root(b);
        if (a == b)
            return;

        if (this.rank[a] < this.rank[b])
            this.parent[a] = b;
        else {
            this.parent[b] = a;
            if (this.rank[b] == this.rank[a])
                this.rank[a] += 1;
        }
    }
}