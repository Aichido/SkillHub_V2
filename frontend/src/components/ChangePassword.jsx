import React, { useState } from 'react';
import axios from 'axios';

export default function ChangePassword() {
    const [ancienPassword, setAncienPassword] = useState('');
    const [nouveauPassword, setNouveauPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await axios.put(`${import.meta.env.VITE_AUTH_URL}/change-password`, {
                ancien_mot_de_passe: ancienPassword,
                nouveau_mot_de_passe: nouveauPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            setMessage("Mot de passe modifié avec succès !");
            setAncienPassword('');
            setNouveauPassword('');
        } catch (error) {
            setMessage(error.response?.data?.message || "Erreur lors de la modification.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Changer mon mot de passe</h3>
            
            <input 
                type="password" 
                placeholder="Ancien mot de passe" 
                value={ancienPassword}
                onChange={(e) => setAncienPassword(e.target.value)}
                required 
            />
            
            <input 
                type="password" 
                placeholder="Nouveau mot de passe (8 car. min, 1 maj, 1 chiffre, 1 spécial)" 
                value={nouveauPassword}
                onChange={(e) => setNouveauPassword(e.target.value)}
                required 
            />
            
            <button type="submit">Valider</button>
            {message && <p>{message}</p>}
        </form>
    );
}