import Spline from "@splinetool/react-spline";


export default function SplineScene() {
    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <Spline scene="/3d/scene.splinecode" />
        </div>
    )
};


