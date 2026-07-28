// services/serviceService.js

import api from "./api";

/* ==============================
   ADMIN
============================== */

export const getAdminServices = async (params = {}) => {
    const { data } = await api.get("/admin/service", {
        params,
    });

    return data;
};

export const getAdminService = async (id) => {
    const { data } = await api.get(`/admin/service/${id}`);

    return data;
};

export const createService = async (formData) => {
    const { data } = await api.post(
        "/admin/service",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return data;
};

export const updateService = async (
    id,
    formData
) => {
    const { data } = await api.put(
        `/admin/service/${id}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return data;
};

export const deleteService = async (id) => {
    const { data } = await api.delete(
        `/admin/service/${id}`
    );

    return data;
};

export const getServiceStats = async () => {
    const { data } = await api.get(
        "/admin/service/stats"
    );

    return data;
};