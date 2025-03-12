import { useRouter } from "next/router";

const ReportPage = () => {
    const router = useRouter();
    const { idReport } = router.query;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Reporte {idReport}</h1>
            <p>Aquí se mostrarán los detalles del reporte con ID: {idReport}</p>
        </div>
    );
};

export default ReportPage;