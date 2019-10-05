let quadclearv = `
void main() {
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}
`;

let quadclearf = `
void main() {
    gl_FragColor = vec4(vec3(0.0), 0.15);
}
`;


export { quadclearv, quadclearf }