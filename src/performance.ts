let performanceData = new Map<string, number>();
let frame: number = 0;
let totalStart: number = performance.now();

export function measure(name: string, func: () => void) {
    const start = performance.now();
    func();
    const end = performance.now();
    
    const elapsed = (end - start);
    
    const logged = performanceData.get(name) || 0;
    performanceData.set(name, logged + elapsed);
}

export function countFrame() {
    frame += 1
}

export function measureReset() {
    let total = performance.now() - totalStart;
    let sum = 0;
    
    const result: string[] = [];

    for (const name of performanceData.keys()) {
        const time = performanceData.get(name) || 0;
        result.push(`${name}:\t${time.toPrecision(3)}ms\t${(time / frame).toPrecision(3)}ms/frame\t${(100 * time / total).toPrecision(3)}%`);
        sum += time;
    }
    
    const time = total - sum;
    result.push(`others:\t${time.toPrecision(3)}ms\t${(time / frame).toPrecision(3)}ms/frame\t${(100 * time / total).toPrecision(3)}%`);
    
    console.log(result.join("\n"));
    document.getElementById("measure_result").innerText = result.join("\n");

    performanceData = new Map();
    frame = 0
    totalStart = performance.now();
}