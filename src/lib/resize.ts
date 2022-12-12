export default function resize(node: HTMLElement) {
  // let CR
  // let ET
  const ro = new ResizeObserver((entries, observer) => {
    // for (let entry of entries) {
    //   CR = entry.contentRect
    //   ET = entry.target
    // }
    node.dispatchEvent(new CustomEvent('resize', {
      // detail: { CR, ET }
      detail: {entries, observer}
    }));
  });
  ro.observe(node);
  return {
    destroy() {
      ro.disconnect();
    }
  }
}
